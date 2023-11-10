package usecase

import "github.com/joaogoulartt/codePix-FullCycle-go/domain/model"

type AccountCase struct {
	PixKeyRepository model.PixKeyRepositoryInterface
}

func (a *AccountCase) RegisterAccount(number string, owner_name string, bankId string) (*model.Account, error) {
	bank, err := a.PixKeyRepository.FindBank(bankId)
	if err != nil {
		return nil, err
	}

	account, err := model.NewAccount(bank, number, owner_name)
	if err != nil {
		return nil, err
	}

	registredAccount, err := a.PixKeyRepository.AddAccount(account)
	if err != nil {
		return nil, err
	}

	return registredAccount, nil
}

func (a *AccountCase) FindAccount(accountId string) (*model.Account, error) {
	account, err := a.PixKeyRepository.FindAccount(accountId)
	if err != nil {
		return nil, err
	}
	return account, nil
}
