import { useState } from 'react';
import MemberSearchField from './MemberSearchField';
import MemberChargeForm from './MemberChargeForm';
import type { User } from '../../types/user';

interface ChargePanelProps {
  // Fired once a charge is confirmed — immediately for the cash family, and
  // for point/qr only once polling reaches 'pagada' — so the host section can
  // refresh its payments table.
  onCharged?: () => void;
}

// The counter's single flow: find the member, then charge them with any of the
// six methods. It owns nothing but who is being charged; everything downstream
// belongs to MemberChargeForm and the useMemberCharge hook it mounts.
const ChargePanel = ({ onCharged }: ChargePanelProps) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Keyed by member so picking a different one starts from a clean form
  // instead of inheriting the previous member's plan, amount or result banner.
  return selectedUser ? (
    <MemberChargeForm
      key={selectedUser.id}
      selectedUser={selectedUser}
      onCharged={onCharged}
      onChangeMember={() => setSelectedUser(null)}
    />
  ) : (
    <MemberSearchField onSelect={setSelectedUser} />
  );
};

export default ChargePanel;
