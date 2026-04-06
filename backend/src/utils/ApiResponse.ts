interface ApiResponseData<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export class ApiResponse<T = unknown> {
  public statusCode: number;
  public success: boolean;
  public message: string;
  public data: T;

  constructor(statusCode: number, data: T, message = 'Success') {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }

  static ok<T>(data: T, message = 'Success'): ApiResponseData<T> {
    return new ApiResponse(200, data, message);
  }

  static created<T>(data: T, message = 'Created successfully'): ApiResponseData<T> {
    return new ApiResponse(201, data, message);
  }

  static noContent(message = 'Deleted successfully'): ApiResponseData<null> {
    return new ApiResponse(200, null, message);
  }
}
