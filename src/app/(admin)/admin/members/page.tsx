import { db } from '@/db'
import { members } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { APP_CONFIG } from '@/lib/config'
import { toggleMemberVerified, toggleMemberSuspended } from '@/actions/admin'

export default async function AdminMembersPage() {
  const allMembers = await db
    .select()
    .from(members)
    .where(eq(members.tenantId, APP_CONFIG.tenantId))
    .orderBy(members.createdAt)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Members</h1>
        <p className="label-mono normal-case tracking-wide">{allMembers.length} total</p>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {['Name', 'Joined', 'Verified', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {allMembers.map((member) => (
              <tr key={member.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium text-[13px]">{member.displayName}</td>
                <td className="px-4 py-3 text-[13px] text-muted-foreground">
                  {new Date(member.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-4 py-3">
                  {member.memberVerifiedAt ? (
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Verified</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Unverified</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {member.suspendedAt ? (
                    <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">Suspended</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Active</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <form action={toggleMemberVerified}>
                      <input type="hidden" name="memberId" value={member.id} />
                      <input type="hidden" name="verified" value={member.memberVerifiedAt ? 'true' : 'false'} />
                      <button type="submit" className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
                        {member.memberVerifiedAt ? 'Unverify' : 'Verify'}
                      </button>
                    </form>
                    <form action={toggleMemberSuspended}>
                      <input type="hidden" name="memberId" value={member.id} />
                      <input type="hidden" name="suspended" value={member.suspendedAt ? 'true' : 'false'} />
                      <button type="submit" className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-2 transition-colors">
                        {member.suspendedAt ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
