/**
 * POST /api/oauth/revoke  { token }
 *
 * Disconnects Yourkly from the signed-in GitHub account. Called when someone
 * signs out, so that signing back in asks them to allow access again.
 *
 * The caller has already signed out locally by the time this runs — a failure
 * here means "still connected on GitHub's side", never "still signed in".
 */

// Kept only so old clients do not leave a raw GitHub token endpoint behind.
// The secure logout handler reads the encrypted HttpOnly session instead.
import logout from '../logout.js'

export default logout
