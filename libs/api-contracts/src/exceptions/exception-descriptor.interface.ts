export interface ExceptionDescriptor {
  errorCode: string;
  statusCode: number;
  message: string;
  // details 등 확장 가능
}
