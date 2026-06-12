package household.account.web.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class CustomException extends RuntimeException {

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;

    public CustomException(ExceptionCode exceptionCode) {
        super(exceptionCode.getMessage());
        this.code = exceptionCode.getCode();
        this.message = exceptionCode.getMessage();
        this.httpStatus = exceptionCode.getHttpStatus();
    }
}
