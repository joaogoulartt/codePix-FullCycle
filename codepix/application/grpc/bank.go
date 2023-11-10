package grpc

import (
	"context"

	"github.com/joaogoulartt/codePix-FullCycle-go/application/grpc/pb"
	"github.com/joaogoulartt/codePix-FullCycle-go/application/usecase"
)

type BankGrpcService struct {
	BankUseCase usecase.BankUseCase
	pb.UnimplementedBankServiceServer
}

func (b *BankGrpcService) CreateBank(ctx context.Context, in *pb.BankRegistration) (*pb.BankCreatedResult, error) {
	Bank, err := b.BankUseCase.CreateBank(in.Code, in.Name)
	if err != nil {
		return &pb.BankCreatedResult{
			Status: "not created",
			Error:  err.Error(),
		}, err
	}

	return &pb.BankCreatedResult{
		Id:     Bank.ID,
		Status: "created",
	}, nil
}

func (b *BankGrpcService) Find(ctx context.Context, in *pb.BankId) (*pb.BankInfo, error) {
	bank, err := b.BankUseCase.FindBank(in.Id)
	if err != nil {
		return &pb.BankInfo{}, err
	}

	result := &pb.BankInfo{
		Id:        bank.ID,
		Code:      bank.Code,
		Name:      bank.Name,
		CreatedAt: bank.CreatedAt.String(),
	}

	if bank.Accounts != nil {
		for _, account := range bank.Accounts {
			accountInfo := &pb.Account{
				AccountId:     account.ID,
				AccountNumber: account.Number,
				OwnerName:     account.OwnerName,
				CreatedAt:     account.CreatedAt.String(),
			}
			// Adicionar accountInfo em result
			result.Accounts.Accounts = append(result.Accounts.Accounts, accountInfo)
		}
	}
	return result, nil
}

func NewBankGrpcService(usecase usecase.BankUseCase) *BankGrpcService {
	return &BankGrpcService{
		BankUseCase: usecase,
	}
}
