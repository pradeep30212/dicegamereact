// Access token lives only in memory (a module-level variable), never in
// localStorage/sessionStorage. This is deliberate: localStorage is readable
// by any script on the page, so a successful XSS attack can silently steal
// a token stored there. Keeping it in memory means a page refresh clears it,
// which is why `bootstrapAuth` (see authSlice.js) silently re-requests a
// fresh access token on load using the httpOnly refresh-token cookie.
let accessToken = null;

const tokenService = {
  getAccessToken: () => accessToken,
  setAccessToken: (token) => {
    accessToken = token;
  },
  clearAccessToken: () => {
    accessToken = null;
  },
};

export default tokenService;
