const config = require("./config");
const pkce = require("./pkce");
const serializer = require("./serializer");
const fetch = require("node-fetch");
const {createProxyMiddleware} = require("http-proxy-middleware");

const BFF_REDIRECT = "http://localhost:3000/oidc/callback";

module.exports = {
    login: async function(req, res) {
        if (req.session && req.session.accessToken) {
            console.log("/login  Already authenticated. Returning to app ...");
            res.redirect(config.redirect);
        } else {
            const verifier = pkce.generateCodeVerifier(80);
            console.log("/login  PKCE verifier generated!");
            const challenge = await pkce.generatePkceChallenge(verifier, "S256");
            console.log("/login  PKCE challenge generated!");
            req.session.pkce = {
                verifier: verifier,
            };
            console.log(verifier);
            console.log(challenge);
            
            const params = new URLSearchParams({
                response_type: "code",
                client_id: config.clientId,
                redirect_uri: BFF_REDIRECT,
                scope: "openid email profile",
                code_challenge_method: "S256",
                code_challenge: challenge,
            });
            
            console.log("/login  redirecting to KC ...");
            res.redirect(config.authUrl + "?" + params.toString());
        }
    },
    
    logout: function(req, res) {
        if (req.session && req.session.idToken) {
            console.log("/logout ending express session ...");
            const idToken = req.session.idToken;
            req.session.destroy();
            console.log("/logout redirecting to KC logout endpoint");
            const params = new URLSearchParams({
                id_token_hint: idToken,
                post_logout_redirect_uri: config.redirect,
            });
            res.redirect(config.logoutUrl + "?" + params.toString());
        } else {
            res.redirect(config.redirect);
        }
    },
    
    /**
     *
     * @param req {Request}
     * @param res {Response}
     * @param next {NextFunction}
     * @return {*|void}
     */
    profile: function(req, res, next) {
        if (req.session && req.session.accessToken) {
            console.log("/profile access token is present, proxying userinfo endpoint");
            return next();
        }
        console.log("/profile no access token in session!");
        return res.status(401).json({status: 401});
    },
    
    profileProxy: createProxyMiddleware({
        target: config.userinfoUrl,
        ignorePath: true,
        secure: false,
        changeOrigin: true,
        toProxy: true,
        onProxyReq: (proxyReq, req, res) => {
            proxyReq.setHeader("Authorization", `Bearer ${req.session.accessToken}`);
        }
    }),
    
    callback: async function(req, res) {
        const code = req.query.code;
        if (!code) {
            console.log("/oidc/callback No code present, send error!");
            return res.status(401).end();
        }
        
        if (!req.session.pkce) {
            console.log("/oidc/callback No associated PKCE challenge with this session");
            return res.status(401).end();
        }
        
        let verifier = null;
        if (req.session && req.session.pkce && req.session.pkce.verifier) {
            verifier = req.session.pkce.verifier;
            console.log(verifier);
        }
        
        const body = serializer.urlEncoded({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: BFF_REDIRECT,
            code_verifier: verifier,
            client_id: config.clientId,
            client_secret: config.clientSecret,
            scopes: "openid profile email"
        });
        
        const resp = await fetch(config.tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body,
        });
        
        if (resp.ok) {
            console.log("/oidc/callback fetched tokens!");
    
            const payload = await resp.json();
            
            req.session.accessToken = payload["access_token"];
            req.session.refreshToken = payload["refresh_token"];
            req.session.idToken = payload["id_token"];
            res.redirect(config.redirect);
        } else {
            console.error(`/oidc/callback error fetching tokens! ${resp.status} ${resp.statusText}`);
            const err = await resp.json();
            console.error("/oidc/callback error payload: ", err);
            res.status(401).end();
        }
    }
}
