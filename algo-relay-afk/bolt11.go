package main

import (
	"errors"
	"math/big"
	"regexp"
)

var (
	millisatsPerBTC = big.NewInt(1e11)
	divisors        = map[string]*big.Int{
		"m": big.NewInt(1e3),
		"u": big.NewInt(1e6),
		"n": big.NewInt(1e9),
		"p": big.NewInt(1e12),
	}
	maxMillisats, _ = big.NewInt(0).SetString("2100000000000000000", 10)
)

func hrpToMillisat(hrp string) (*big.Int, error) {
	re := regexp.MustCompile(`^ln[a-z]{2}(\d+[munp]?)`)
	matches := re.FindStringSubmatch(hrp)
	if matches == nil || len(matches) < 2 {
		return nil, errors.New("not a valid human-readable amount")
	}

	amountStr := matches[1]

	reAmount := regexp.MustCompile(`^(\d+)([munp]?)$`)
	amountMatches := reAmount.FindStringSubmatch(amountStr)
	if amountMatches == nil {
		return nil, errors.New("invalid amount format")
	}

	valueStr := amountMatches[1]
	multiplier := amountMatches[2]

	value := big.NewInt(0)
	_, ok := value.SetString(valueStr, 10)
	if !ok {
		return nil, errors.New("invalid value in human-readable amount")
	}

	var millisatoshis *big.Int
	if multiplier == "" {
		millisatoshis = big.NewInt(0).Mul(value, millisatsPerBTC)
	} else {
		divisor, exists := divisors[multiplier]
		if !exists {
			return nil, errors.New("invalid multiplier for the amount")
		}
		millisatoshis = big.NewInt(0).Mul(value, millisatsPerBTC)
		millisatoshis = big.NewInt(0).Div(millisatoshis, divisor)
	}

	if millisatoshis.Cmp(maxMillisats) > 0 {
		return nil, errors.New("amount is outside of valid range")
	}

	return millisatoshis, nil
}
