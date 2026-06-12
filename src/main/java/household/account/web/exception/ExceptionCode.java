package household.account.web.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ExceptionCode {

    SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "-1", "서버에러"),
    BAD_REQUEST(HttpStatus.BAD_REQUEST, "-2", "절못된 요청입니다."),
    CATEGORY_ALREADY_EXIST(HttpStatus.BAD_REQUEST,  "-100", "이미 등록된 카테고리입니다.")
    ;

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
