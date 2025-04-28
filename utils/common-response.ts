export function common_success(msg?: any) {
  return {
    statusCode: 200,
    headers: { "Access-Control-Allow-Origin": "*" },
    isBase64Encoded: false,
    body: `${msg}`,
  };
}

export function common_error(msg?: any, errorCode?: any) {
  return {
    statusCode: errorCode ? errorCode : 500,
    headers: { "Access-Control-Allow-Origin": "*" },
    isBase64Encoded: false,
    body: `${msg ? msg : "GENERIC FAIL MESSAGE"}`,
  };
}
