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
        <h1 className="text-xl font-semibold">members</h1>
        <p className="text-sm text-muted-foreground">{allMembers.length} total</p>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">joined</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">verified</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">suspended</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {allMembers.map((member) => (
              <tr key={member.id} className="hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{member.displayName}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(member.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {member.memberVerifiedAt ? (
                    <span className="text-green-600 font-medium">verified</span>
                  ) : (
                    <span className="text-muted-foreground">unverified</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {member.suspendedAt ? (
                    <span className="text-destructive font-medium">suspended</span>
                  ) : (
                    <span className="text-muted-foreground">active</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <form action={toggleMemberVerified}>
                      <input type="hidden" name="memberId" value={member.id} />
                      <input
                        type="hidden"
                        name="verified"
                        value={member.memberVerifiedAt ? 'true' : 'false'}
                      />
                      <button
                        type="submit"
                        className="text-xs underline underline-offset-2 hover:text-foreground text-muted-foreground"
                      >
                        {member.memberVerifiedAt ? 'unverify' : 'verify'}
                      </button>
                    </form>
                    <form action={toggleMemberSuspended}>
                      <input type="hidden" name="memberId" value={member.id} />
                      <input
                        type="hidden"
                        name="suspended"
                        value={member.suspendedAt ? 'true' : 'false'}
                      />
                      <button
                        type="submit"
                        className="text-xs underline underline-offset-2 hover:text-foreground text-muted-foreground"
                      >
                        {member.suspendedAt ? 'unsuspend' : 'suspend'}
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
