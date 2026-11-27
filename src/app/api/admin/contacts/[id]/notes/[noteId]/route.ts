import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";
import { addAuditLog } from "@/lib/admin/audit";
import { canManageNotes, recordContactActivity } from "@/lib/contact/admin";
import type { Prisma } from "@prisma/client";

type Ctx = { params: Promise<{ id: string; noteId: string }> };

function canMutateNote(role: string, actorId: string, noteAuthorId: string | null) {
  if (role === "owner" || role === "administrator") return true;
  return !!noteAuthorId && noteAuthorId === actorId;
}

export async function PATCH(request: Request, ctx: Ctx) {
  const g = await adminGuard(request, { minimum: "editor", mutate: true, rateKey: "admin:contacts:notes:update" });
  if ("error" in g) return g.error;
  if (!canManageNotes(g.user.role)) return adminJson({ ok: false, error: "Forbidden" }, { status: 403 }, g.rl);
  const { id, noteId } = await ctx.params;
  let body: unknown;
  try { body = await request.json(); } catch { return adminJson({ ok: false, error: "Invalid JSON" }, { status: 400 }, g.rl); }
  const r = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const bodyText = typeof r.body === "string" ? r.body.trim() : "";
  if (!bodyText) return adminJson({ ok: false, error: "Note body is required" }, { status: 400 }, g.rl);
  if (bodyText.length > 5000) return adminJson({ ok: false, error: "Note too long" }, { status: 400 }, g.rl);

  const prisma = getPrisma();
  const note = await prisma.contactNote.findUnique({ where: { id: noteId }, select: { id: true, submissionId: true, authorId: true } });
  if (!note || note.submissionId !== id) return adminJson({ ok: false, error: "Not found" }, { status: 404 }, g.rl);
  if (!canMutateNote(g.user.role, g.user.id, note.authorId)) return adminJson({ ok: false, error: "Forbidden" }, { status: 403 }, g.rl);

  const updated = await prisma.contactNote.update({ where: { id: noteId }, data: { body: bodyText }, include: { author: { select: { id: true, email: true, name: true } } } });
  await recordContactActivity({ submissionId: id, actorId: g.user.id, actorEmail: g.user.email, type: "note_edited", detail: { noteId } });
  await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "contact.note_edit", targetType: "contact_note", targetId: noteId, detail: { submissionId: id } as Prisma.InputJsonValue });
  return adminJson({ ok: true, note: updated }, undefined, g.rl);
}

export async function DELETE(request: Request, ctx: Ctx) {
  const g = await adminGuard(request, { minimum: "editor", mutate: true, rateKey: "admin:contacts:notes:delete" });
  if ("error" in g) return g.error;
  if (!canManageNotes(g.user.role)) return adminJson({ ok: false, error: "Forbidden" }, { status: 403 }, g.rl);
  const { id, noteId } = await ctx.params;
  const prisma = getPrisma();
  const note = await prisma.contactNote.findUnique({ where: { id: noteId }, select: { id: true, submissionId: true, authorId: true } });
  if (!note || note.submissionId !== id) return adminJson({ ok: false, error: "Not found" }, { status: 404 }, g.rl);
  if (!canMutateNote(g.user.role, g.user.id, note.authorId)) return adminJson({ ok: false, error: "Forbidden" }, { status: 403 }, g.rl);
  await prisma.contactNote.delete({ where: { id: noteId } });
  await recordContactActivity({ submissionId: id, actorId: g.user.id, actorEmail: g.user.email, type: "note_deleted", detail: { noteId } });
  await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "contact.note_delete", targetType: "contact_note", targetId: noteId, detail: { submissionId: id } as Prisma.InputJsonValue });
  return adminJson({ ok: true }, undefined, g.rl);
}
