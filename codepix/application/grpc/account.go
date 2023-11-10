package grpc

import (
	"context"

	"github.com/joaogoulartt/codePix-FullCycle-go/application/grpc/pb"
	"github.com/joaogoulartt/codePix-FullCycle-go/application/usecase"
)

type AccountGrpcService struct {
	AccountCase usecase.AccountCase
	pb.UnimplementedAccountServiceServer
}

func (a *AccountGrpcService) RegisterAccount(ctx context.Context, in *pb.AccountRegistration) (*pb.AccountCreatedResult, error) {
	account, err := a.AccountCase.RegisterAccount(in.Number, in.OwnerName, in.BankId)
	if err != nil {
		return &pb.AccountCreatedResult{
			Status: "not created",
			Error:  err.Error(),
		}, err
	}

	return &pb.AccountCreatedResult{
		Id:     account.ID,
		Status: "created",
	}, nil
}

func (a *AccountGrpcService) Find(ctx context.Context, in *pb.AccountId) (*pb.AccountInfo, error) {
	account, err := a.AccountCase.FindAccount(in.Id)
	if err != nil {
		return &pb.AccountInfo{}, err
	}

	return &pb.AccountInfo{
		Id:        account.ID,
		Number:    account.Number,
		OwnerName: account.OwnerName,
		Bank: &pb.Bank{
			BankId: account.BankID,
			Code:   account.Bank.Code,
			Name:   account.Bank.Name,
		},
		CreatedAt: account.CreatedAt.String(),
	}, nil
}

func NewAccountGrpcService(usecase usecase.AccountCase) *AccountGrpcService {
	return &AccountGrpcService{
		AccountCase: usecase,
	}
}
