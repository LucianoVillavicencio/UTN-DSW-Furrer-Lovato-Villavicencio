import { toPublicCard } from './savedCard.mapper';
import type { SavedCard } from './entity/savedCard.entity';

describe('toPublicCard', () => {
  it('returns exactly { id, lastFourDigits, paymentMethodId, expirationMonth, expirationYear }', () => {
    const fullCard: SavedCard = {
      id: 1,
      userId: 40000001,
      mpCustomerId: 'customer-secret-id',
      mpCardId: 'card-secret-id',
      lastFourDigits: '4242',
      paymentMethodId: 'visa',
      expirationMonth: 12,
      expirationYear: 2030,
      active: true,
      deleted: false,
    };

    const result = toPublicCard(fullCard);

    expect(result).toEqual({
      id: 1,
      lastFourDigits: '4242',
      paymentMethodId: 'visa',
      expirationMonth: 12,
      expirationYear: 2030,
    });
  });

  it('does not expose mpCustomerId', () => {
    const fullCard: SavedCard = {
      id: 1,
      userId: 40000001,
      mpCustomerId: 'customer-secret-id',
      mpCardId: 'card-secret-id',
      lastFourDigits: '4242',
      paymentMethodId: 'visa',
      expirationMonth: 12,
      expirationYear: 2030,
      active: true,
      deleted: false,
    };

    const result = toPublicCard(fullCard);

    expect(result).not.toHaveProperty('mpCustomerId');
  });

  it('does not expose mpCardId', () => {
    const fullCard: SavedCard = {
      id: 1,
      userId: 40000001,
      mpCustomerId: 'customer-secret-id',
      mpCardId: 'card-secret-id',
      lastFourDigits: '4242',
      paymentMethodId: 'visa',
      expirationMonth: 12,
      expirationYear: 2030,
      active: true,
      deleted: false,
    };

    const result = toPublicCard(fullCard);

    expect(result).not.toHaveProperty('mpCardId');
  });
});
