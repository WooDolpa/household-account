package household.account.web.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ExceptionCode {

    SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "-1", "서버에러"),
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "-2", "절못된 요청입니다."),
    CATEGORY_ALREADY_EXIST(HttpStatus.BAD_REQUEST,  "-100", "이미 등록된 카테고리입니다."),
    PARENT_CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "-101", "대분류 카테고리를 찾을 수 없습니다."),
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "-102", "소분류 카테고리를 찾을 수 없습니다."),
    RECEIPT_NOT_FOUND(HttpStatus.NOT_FOUND, "-110", "사용내역이 존재하지 않습니다."),
    EXCEL_FILE_INVALID(HttpStatus.BAD_REQUEST, "-10", "엑셀 파일(.xlsx)만 업로드할 수 있습니다."),
    EXCEL_EMPTY(HttpStatus.BAD_REQUEST, "-11", "등록할 데이터가 없습니다."),
    EXCEL_PARSE_FAIL(HttpStatus.BAD_REQUEST, "-12", "엑셀 파일을 읽을 수 없습니다."),
    EXCEL_ROW_INVALID(HttpStatus.BAD_REQUEST, "-13", "엑셀 데이터 검증에 실패했습니다."),
    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
