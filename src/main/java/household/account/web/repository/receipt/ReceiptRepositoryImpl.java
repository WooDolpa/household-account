package household.account.web.repository.receipt;

import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class ReceiptRepositoryImpl implements ReceiptCustomRepository {

    private final JPAQueryFactory factory;


}
