import jwt from 'jsonwebtoken';
import axios from 'axios';

const JWKS_URL = process.env.COGNITO_JWKS!;

export const handler = async (event: any, _context: any, callback: any) => {
    console.log("🟢 Handler triggered. EVENT: ", JSON.stringify(event));

    try {
        const authHeader = event.identitySource?.[0];
        if (!authHeader) {
            console.error('❌ No Authorization header found');
            return callback("Unauthorized");
        }

        console.log("🟢 Authorization header present:", authHeader);

        const token = authHeader.split(' ')[1];
        if (!token) {
            console.error('❌ No token found after Bearer');
            return callback("Unauthorized");
        }

        console.log("🟢 Token extracted:", token.slice(0, 30) + "...");

        // Step 1: Decode token header to find the kid
        const decodedHeader = jwt.decode(token, { complete: true })?.header as jwt.JwtHeader;
        if (!decodedHeader || !decodedHeader.kid) {
            console.error('❌ Token missing kid header');
            return callback("Unauthorized");
        }

        console.log('🔵 Decoded JWT header:', decodedHeader);

        // Step 2: Fetch the JWKS
        const jwks = (await axios.get(JWKS_URL)).data.keys;
        console.log('🔵 JWKS keys fetched:', jwks.length);

        const key = jwks.find((k: any) => k.kid === decodedHeader.kid);
        if (!key) {
            console.error('❌ Unable to find matching key for kid:', decodedHeader.kid);
            return callback("Unauthorized");
        }

        console.log('🟢 Matching key found.');

        // Step 3: Build the PEM public key
        const pubKey = buildPem(key.n, key.e);
        console.log('🛠 Public Key (PEM) built.');

        // Step 4: Verify token
        const verifiedToken = jwt.verify(token, pubKey, { algorithms: ['RS256'] }) as any;

        console.log('✅ Token verified:', verifiedToken);

        // Step 5: Return success
        callback(null, generatePolicy(verifiedToken.sub, 'Allow', event.routeArn, { sub: verifiedToken.sub }));

    } catch (error) {
        console.error('❌ Exception occurred:', error);
        callback("Unauthorized");
    }
};

// Utility to build the PEM key
function buildPem(modulus: string, exponent: string): string {
    const rsaPublicKey = {
        kty: 'RSA',
        n: modulus,
        e: exponent,
    };

    const key = require('jwk-to-pem')(rsaPublicKey);
    return key;
}

const generatePolicy = (principalId: string, effect: string, resource: string, context: any) => ({
    principalId,
    policyDocument: {
        Version: '2012-10-17',
        Statement: [{
            Action: 'execute-api:Invoke',
            Effect: effect,
            Resource: resource
        }]
    },
    context
});
