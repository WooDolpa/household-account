package household.account.web.converter;

import household.account.web.enums.PaymentType;
import household.account.web.exception.CustomException;
import household.account.web.exception.ExceptionCode;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Converter(autoApply = true)
public class PaymentTypeConverter implements AttributeConverter<PaymentType, String> {

    @Override
    public String convertToDatabaseColumn(PaymentType paymentType) {

        if(paymentType == null) {
            return null;
        }

        return paymentType.getKey();
    }

    @Override
    public PaymentType convertToEntityAttribute(String s) {

        if(s == null) {
            return null;
        }

        PaymentType paymentType = PaymentType.findPaymentType(s);
        if(paymentType != null) {
            return paymentType;
        }

        log.error("[PaymentTypeConverter][convertToEntityAttribute] paymentType is null");
        throw new CustomException(ExceptionCode.SERVER_ERROR);
    }
}
