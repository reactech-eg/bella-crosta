import { signOut } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  // signOut() deletes the cookie then calls redirect('/').
  // redirect() throws NEXT_REDIRECT internally.
  await signOut()
}
