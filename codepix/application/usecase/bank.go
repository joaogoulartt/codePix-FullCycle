package usecase

import "github.com/joaogoulartt/codePix-FullCycle-go/domain/model"

type BankUseCase struct {
	PixKeyRepository model.PixKeyRepositoryInterface
}

func (b *BankUseCase) CreateBank(code string, name string) (*model.Bank, error) {
	bank, err := model.NewBank(code, name)
	if err != nil {
		return nil, err
	}

	createdBank, err := b.PixKeyRepository.AddBank(bank)
	if err != nil {
		return nil, err
	}

	return createdBank, nil
}

func (b *BankUseCase) FindBank(bankId string) (*model.Bank, error) {
	bank, err := b.PixKeyRepository.FindBank(bankId)
	if err != nil {
		return nil, err
	}
	return bank, nil
}
