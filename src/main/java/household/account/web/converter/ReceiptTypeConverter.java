package household.account.web.converter;

import household.account.web.enums.ReceiptType;
import household.account.web.exception.CustomException;
import household.account.web.exception.ExceptionCode;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Converter(autoApply = true)
public class ReceiptTypeConverter implements AttributeConverter<ReceiptType, String> {

    @Override
    public String convertToDatabaseColumn(ReceiptType receiptType) {
        if(receiptType == null) {
            return null;
        }
        return receiptType.getKey();
    }

    @Override
    public ReceiptType convertToEntityAttribute(String s) {

        if(s == null) {
            return null;
        }

        ReceiptType receiptType = ReceiptType.findReceiptType(s);
        if(receiptType != null) {
            return receiptType;
        }

        log.error("[ReceiptTypeConverter][convertToEntityAttribute] receiptType is null");
        throw new CustomException(ExceptionCode.SERVER_ERROR);
    }
}
