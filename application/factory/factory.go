package factory

import (
	"github.com/jinzhu/gorm"
	"github.com/joaogoulartt/codePix-FullCycle-go/application/usecase"
	"github.com/joaogoulartt/codePix-FullCycle-go/infrastructure/repository"
)

func TransactionUseCaseFactory(database *gorm.DB) usecase.TransactionUseCase {
	pixRepository := repository.PixKeyRepositoryDb{Db: database}
	transactionRepository := repository.TransactionRepositoryDb{Db: database}

	transactionUseCase := usecase.TransactionUseCase{
		TransactionRepository: &transactionRepository,
		PixRepository:         &pixRepository,
	}

	return transactionUseCase
}
