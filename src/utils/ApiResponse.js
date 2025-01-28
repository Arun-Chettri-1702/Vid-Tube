// standardization of response to the user on frontend

class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400; // if statusCode is lesser than 400 then success is true
    }
}


export { ApiResponse }