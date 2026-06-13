type StatCard = {
  label: string;
  value: string;
  delta: string;
  icon: React.ReactNode;
};

type StatCardsProps = {
  cards: StatCard[];
};

export function StatCards({ cards }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl bg-gray-100 p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-500">
            {card.icon}
            {card.label}
          </div>
          <p className="text-2xl font-medium text-gray-900">{card.value}</p>
          <p className="mt-0.5 text-xs text-gray-500">{card.delta}</p>
        </div>
      ))}
    </div>
  );
}
