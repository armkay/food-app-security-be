import jwt from 'jsonwebtoken';
import axios from 'axios';

const JWKS_URL = process.env.COGNITO_JWKS!;

export const handler = async (event: any, _context: any, callback: any) => {

    try {
        const authHeader = event.identitySource?.[0];
        if (!authHeader) {
            return callback("Unauthorized");
        }


        const token = authHeader.split(' ')[1];
        if (!token) {
            return callback("Unauthorized");
        }

        const decodedHeader = jwt.decode(token, { complete: true })?.header as jwt.JwtHeader;
        if (!decodedHeader || !decodedHeader.kid) {
            return callback("Unauthorized");
        }

        const jwks = (await axios.get(JWKS_URL)).data.keys;

        const key = jwks.find((k: any) => k.kid === decodedHeader.kid);
        if (!key) {
            return callback("Unauthorized");
        }

        const pubKey = buildPem(key.n, key.e);
        const verifiedToken = jwt.verify(token, pubKey, { algorithms: ['RS256'] }) as any;

        callback(null, generatePolicy(verifiedToken.sub, 'Allow', event.routeArn, { sub: verifiedToken.sub }));

    } catch (error) {
        console.error('Exception occurred:', error);
        callback("Unauthorized");
    }
};

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
