package household.account.web.repository.receipt;

import household.account.web.domain.receipt.Receipt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReceiptRepository extends JpaRepository<Receipt, Integer>, ReceiptCustomRepository {
}
