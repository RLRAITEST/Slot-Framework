import { API_AMOUNT_MULTIPLIER } from 'constants-shared/bet';
import { rgsFetcher } from 'rgs-fetcher';

import baseBooks from '../stories/data/base_books';
import bonusBooks from '../stories/data/bonus_books';

/**
 * Localhost play without Stake: when the URL has no sessionID, serve
 * authenticate / play / end-round from storybook books. Real RGS is used
 * as soon as sessionID is present.
 */
const originalPost = rgsFetcher.post.bind(rgsFetcher);

const BET_LEVELS = [1, 5, 25, 50, 75, 100, 200, 500, 800, 1000].map(
	(level) => level * API_AMOUNT_MULTIPLIER,
);

let balanceAmount = 10_000 * API_AMOUNT_MULTIPLIER;

type Book = (typeof baseBooks)[number];

const pickBook = (books: Book[]) => books[Math.floor(Math.random() * books.length)] ?? books[0];

const isBonusMode = (mode: string) => {
	const key = mode.toUpperCase();
	return key === 'BONUS' || key === 'BUY' || key.includes('BONUS');
};

rgsFetcher.post = (async (options: Parameters<typeof rgsFetcher.post>[0]) => {
	const sessionID = (options.variables as { sessionID?: string } | undefined)?.sessionID;
	if (sessionID) return originalPost(options);

	if (options.url === '/wallet/authenticate') {
		return {
			balance: { amount: balanceAmount, currency: 'USD' },
			config: {
				gameID: 'halloween',
				minBet: BET_LEVELS[0],
				maxBet: BET_LEVELS[BET_LEVELS.length - 1],
				stepBet: BET_LEVELS[0],
				defaultBetLevel: BET_LEVELS[0],
				betLevels: BET_LEVELS,
				jurisdiction: {
					socialCasino: false,
					disabledFullscreen: false,
					disabledTurbo: false,
					disabledSuperTurbo: false,
					disabledAutoplay: false,
					disabledSlamstop: false,
					disabledSpacebar: false,
					disabledBuyFeature: false,
					displayNetPosition: false,
					displayRTP: false,
					displaySessionTimer: false,
					minimumRoundDuration: 0,
				},
			},
		};
	}

	if (options.url === '/wallet/play') {
		const variables = options.variables as { mode?: string; amount?: number };
		const mode = variables?.mode || 'BASE';
		const amount = variables?.amount || API_AMOUNT_MULTIPLIER;
		const book = pickBook((isBonusMode(mode) ? bonusBooks : baseBooks) as Book[]);
		const payout = Math.round((book.payoutMultiplier || 0) * amount);
		balanceAmount = Math.max(0, balanceAmount - amount + payout);

		return {
			balance: { amount: balanceAmount, currency: 'USD' },
			round: {
				betID: book.id,
				amount,
				payout,
				payoutMultiplier: book.payoutMultiplier,
				active: false,
				state: book.events,
				mode,
			},
		};
	}

	if (options.url === '/wallet/end-round' || options.url === '/bet/event') {
		return { balance: { amount: balanceAmount, currency: 'USD' } };
	}

	return originalPost(options);
}) as typeof rgsFetcher.post;
