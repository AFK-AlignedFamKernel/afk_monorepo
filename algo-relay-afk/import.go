package main

import (
	"context"
	"log"
	"time"

	"github.com/nbd-wtf/go-nostr"
)

const layout = "2006-01-02"

func importNotes(kind int) {
	ctx := context.Background()
	startDate := time.Now().Add(-3 * 24 * time.Hour)
	startTime, _ := time.Parse(layout, startDate.Format(layout))
	endTime := startTime.Add(24 * time.Hour)

	for {
		ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
		defer cancel()

		startTimestamp := nostr.Timestamp(startTime.Unix())
		endTimestamp := nostr.Timestamp(endTime.Unix())

		filters := []nostr.Filter{{
			Kinds: []int{kind},
			Since: &startTimestamp,
			Until: &endTimestamp,
		}}

		for ev := range pool.SubManyEose(ctx, relays, filters) {
			repository.SaveNostrEvent(ev.Event)
		}

		startTime = startTime.Add(24 * time.Hour)
		endTime = endTime.Add(24 * time.Hour)

		if startTime.After(time.Now()) {
			log.Println("✅ imported notes of kind:", kind)
			break
		}

		log.Println("importing notes of kind:", kind, "from", startTime.Format(layout), "to", endTime.Format(layout))
	}
}
