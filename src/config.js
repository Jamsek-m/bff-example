// For example keycloak, it would be:
// $AUTH_HOST = https://keycloak.example.org/realms/realm-name
module.exports = {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    authUrl: "https://$AUTH_HOST/protocol/openid-connect/auth",
    tokenUrl: "https://$AUTH_HOST/protocol/openid-connect/token",
    userinfoUrl: "https://$AUTH_HOST/protocol/openid-connect/userinfo",
    logoutUrl: "https://$AUTH_HOST/protocol/openid-connect/logout",
    redirect: process.env.WEB_APP_URL,
    sessionSecret: process.env.SESSION_KEY
}
