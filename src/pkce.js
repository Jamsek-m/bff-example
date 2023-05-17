const crypto = require("crypto");

/**
 *
 * @param len {number}
 * @returns {string}
 */
function generateCodeVerifier(len) {
    return crypto
        .randomBytes(60)
        .toString("hex")
        .slice(0, 128);
}

/**
 *
 * @param verifier {string}
 * @param method {"S256" | "plain"}
 * @returns {Promise<string>}
 */
async function generatePkceChallenge(verifier, method) {
    if (method === "S256") {
        return crypto
            .createHash("sha256")
            .update(Buffer.from(verifier))
            .digest('base64url');
    }
    // If plain, verifier == challenge
    return verifier;
}

module.exports = {
    generateCodeVerifier: generateCodeVerifier,
    generatePkceChallenge: generatePkceChallenge
};
