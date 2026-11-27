import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";
import { addAuditLog } from "@/lib/admin/audit";
import { canManageNotes, recordContactActivity } from "@/lib/contact/admin";
import type { Prisma } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const g = await adminGuard(request, { minimum: "editor", mutate: true, rateKey: "admin:contacts:notes:create" });
  if ("error" in g) return g.error;
  if (!canManageNotes(g.user.role)) return adminJson({ ok: false, error: "Forbidden" }, { status: 403 }, g.rl);
  const { id } = await ctx.params;
  let body: unknown;
  try { body = await request.json(); } catch { return adminJson({ ok: false, error: "Invalid JSON" }, { status: 400 }, g.rl); }
  const r = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const bodyText = typeof r.body === "string" ? r.body.trim() : "";
  if (!bodyText) return adminJson({ ok: false, error: "Note body is required" }, { status: 400 }, g.rl);
  if (bodyText.length > 5000) return adminJson({ ok: false, error: "Note too long" }, { status: 400 }, g.rl);

  const prisma = getPrisma();
  const submission = await prisma.contactSubmission.findUnique({ where: { id }, select: { id: true } });
  if (!submission) return adminJson({ ok: false, error: "Not found" }, { status: 404 }, g.rl);

  const note = await prisma.contactNote.create({
    data: { submissionId: id, authorId: g.user.id, authorEmail: g.user.email, body: bodyText },
    include: { author: { select: { id: true, email: true, name: true } } },
  });
  await recordContactActivity({ submissionId: id, actorId: g.user.id, actorEmail: g.user.email, type: "note_added", detail: { noteId: note.id } });
  await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "contact.note_add", targetType: "contact_note", targetId: note.id, detail: { submissionId: id } as Prisma.InputJsonValue });
  return adminJson({ ok: true, note }, { status: 201 }, g.rl);
}
