package household.account.web.converter;

import household.account.web.enums.Installment;
import household.account.web.exception.CustomException;
import household.account.web.exception.ExceptionCode;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Converter(autoApply = true)
public class InstallmentConverter implements AttributeConverter<Installment, String> {

    @Override
    public String convertToDatabaseColumn(Installment installment) {

        if(installment == null) {
            return null;
        }

        return installment.getKey();
    }

    @Override
    public Installment convertToEntityAttribute(String s) {

        if(s == null) {
            return null;
        }

        Installment installment = Installment.findByInstallment(s);
        if(installment != null) {
            return installment;
        }

        log.error("[InstallmentConverter][convertToEntityAttribute] installment is null");
        throw new CustomException(ExceptionCode.SERVER_ERROR);
    }
}
