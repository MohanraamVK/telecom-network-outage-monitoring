/** An unsigned JWT-shaped token that expires `secondsFromNow` from now (for tests). */
export function fakeToken(secondsFromNow = 900, subject = "admin") {
  const encode = (value) => btoa(JSON.stringify(value)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  const exp = Math.floor(Date.now() / 1000) + secondsFromNow;
  return `${encode({ alg: "HS256" })}.${encode({ sub: subject, exp })}.signature`;
}

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
