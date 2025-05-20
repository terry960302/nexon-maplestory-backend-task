import { ExceptionDescriptor } from "@api-contracts/exceptions/exception-descriptor.interface";

export enum GlobalErrorCode {
  INTERNAL_ERROR = "GLOBAL_0001",
  INVALID_PARAMETER = "GLOBAL_0002",
}

export const GlobalErrors: Record<GlobalErrorCode, ExceptionDescriptor> = {
  [GlobalErrorCode.INTERNAL_ERROR]: {
    errorCode: GlobalErrorCode.INTERNAL_ERROR,
    statusCode: 500,
    message: "서버 내부 오류입니다.",
  },
  [GlobalErrorCode.INVALID_PARAMETER]: {
    errorCode: GlobalErrorCode.INVALID_PARAMETER,
    statusCode: 400,
    message: "요청 파라미터가 잘못되었습니다.",
  },
};
