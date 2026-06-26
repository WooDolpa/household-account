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
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "-102", "소분류 카테고리를 찾을 수 없습니다.")
    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
