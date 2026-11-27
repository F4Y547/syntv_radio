import { adminGuard, adminJson } from "@/lib/admin/api";
import { getPrisma } from "@/lib/db";
import { addAuditLog } from "@/lib/admin/audit";
import { canReplyContact, recordContactActivity } from "@/lib/contact/admin";
import { ContactReplyError, hasHeaderInjection, isValidEmail, sendContactReply } from "@/lib/contact/reply";
import type { Prisma } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const g = await adminGuard(request, { minimum: "editor", mutate: true, rateKey: "admin:contacts:reply", limit: 10, windowMs: 60_000 });
  if ("error" in g) return g.error;
  if (!canReplyContact(g.user.role)) return adminJson({ ok: false, error: "Forbidden" }, { status: 403 }, g.rl);

  const { id } = await ctx.params;
  let body: unknown;
  try { body = await request.json(); } catch { return adminJson({ ok: false, error: "Invalid JSON" }, { status: 400 }, g.rl); }
  const r = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  const subject = typeof r.subject === "string" ? r.subject.trim() : "";
  const bodyText = typeof r.bodyText === "string" ? r.bodyText.trim() : "";
  if (!subject) return adminJson({ ok: false, error: "Subject is required" }, { status: 400 }, g.rl);
  if (subject.length > 200 || hasHeaderInjection(subject)) return adminJson({ ok: false, error: "Invalid subject" }, { status: 400 }, g.rl);
  if (!bodyText) return adminJson({ ok: false, error: "Message is required" }, { status: 400 }, g.rl);
  if (bodyText.length > 10_000) return adminJson({ ok: false, error: "Message too long" }, { status: 400 }, g.rl);

  const prisma = getPrisma();
  const submission = await prisma.contactSubmission.findUnique({ where: { id }, select: { id: true, email: true, status: true } });
  if (!submission) return adminJson({ ok: false, error: "Not found" }, { status: 404 }, g.rl);
  if (!isValidEmail(submission.email)) return adminJson({ ok: false, error: "Submission has invalid recipient email" }, { status: 400 }, g.rl);

  const reply = await prisma.contactReply.create({
    data: {
      submissionId: id,
      actorId: g.user.id,
      actorEmail: g.user.email,
      toEmail: submission.email,
      subject,
      bodyText,
      status: "PENDING",
      provider: "resend",
    },
  });

  await recordContactActivity({ submissionId: id, actorId: g.user.id, actorEmail: g.user.email, type: "reply_attempted", detail: { replyId: reply.id } });
  await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "contact.reply_attempt", targetType: "contact", targetId: id, detail: { replyId: reply.id } as Prisma.InputJsonValue });

  try {
    const result = await sendContactReply({ toEmail: submission.email, subject, bodyText }, reply.id);
    const now = new Date();
    const [updatedReply] = await prisma.$transaction([
      prisma.contactReply.update({ where: { id: reply.id }, data: { status: "SENT", providerMessageId: result.providerMessageId, sentAt: now, error: null } }),
      prisma.contactSubmission.update({ where: { id }, data: { status: "REPLIED", repliedAt: now } }),
      prisma.contactActivity.create({ data: { submissionId: id, actorId: g.user.id, actorEmail: g.user.email, type: "reply_sent", detail: { replyId: reply.id, providerMessageId: result.providerMessageId } as Prisma.InputJsonValue } }),
      prisma.auditLog.create({ data: { actorId: g.user.id, actorEmail: g.user.email, action: "contact.reply_sent", targetType: "contact", targetId: id, detail: { replyId: reply.id, providerMessageId: result.providerMessageId } as Prisma.InputJsonValue } }),
    ]);
    return adminJson({ ok: true, reply: updatedReply }, undefined, g.rl);
  } catch (err) {
    const message = err instanceof ContactReplyError ? err.message : "The email provider could not be reached.";
    await prisma.contactReply.update({ where: { id: reply.id }, data: { status: "FAILED", error: message.slice(0, 500) } });
    await recordContactActivity({ submissionId: id, actorId: g.user.id, actorEmail: g.user.email, type: "reply_failed", detail: { replyId: reply.id, error: message } });
    await addAuditLog({ actorId: g.user.id, actorEmail: g.user.email, action: "contact.reply_failed", targetType: "contact", targetId: id, detail: { replyId: reply.id } as Prisma.InputJsonValue });
    return adminJson({ ok: false, error: message, replyId: reply.id }, { status: 502 }, g.rl);
  }
}
