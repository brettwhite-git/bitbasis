"use client"

interface CostBasisComparisonProps {
  method: "FIFO" | "LIFO" | "Average Cost"
}

export function CostBasisComparison({ method }: CostBasisComparisonProps) {
  // This would be calculated based on the method in a real app
  const costBasisData = {
    FIFO: {
      totalCostBasis: "$18,420.69",
      averageCost: "$43,858.79",
      unrealizedGain: "$6,143.13",
      unrealizedGainPercent: "33.3%",
      potentialTaxLiability: "$921.47",
    },
    LIFO: {
      totalCostBasis: "$19,850.25",
      averageCost: "$47,262.50",
      unrealizedGain: "$4,713.57",
      unrealizedGainPercent: "23.7%",
      potentialTaxLiability: "$707.04",
    },
    "Average Cost": {
      totalCostBasis: "$19,135.47",
      averageCost: "$45,560.64",
      unrealizedGain: "$5,428.35",
      unrealizedGainPercent: "28.4%",
      potentialTaxLiability: "$814.25",
    },
  }

  const data = costBasisData[method]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground">Total Cost Basis</div>
          <div className="text-2xl font-bold text-white">{data.totalCostBasis}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground">Average Cost per BTC</div>
          <div className="text-2xl font-bold text-white">{data.averageCost}</div>
        </div>
        <div className="rounded-lg border border-border p-4">
          <div className="text-sm text-muted-foreground">Unrealized Gain</div>
          <div className="text-2xl font-bold text-bitcoin-orange">
            {data.unrealizedGain} ({data.unrealizedGainPercent})
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <h3 className="mb-4 text-lg font-medium text-white">Method Explanation</h3>
        {method === "FIFO" && (
          <p className="text-muted-foreground">
            First In, First Out (FIFO) assumes that the first Bitcoin you purchased is the first one you sell. This
            method typically results in lower capital gains for assets that appreciate over time, as earlier purchases
            often have a lower cost basis.
          </p>
        )}
        {method === "LIFO" && (
          <p className="text-muted-foreground">
            Last In, First Out (LIFO) assumes that the most recently purchased Bitcoin is the first one you sell. This
            method can be beneficial in a rising market as it may result in higher cost basis and lower capital gains.
          </p>
        )}
        {method === "Average Cost" && (
          <p className="text-muted-foreground">
            Average Cost method calculates the cost basis by taking the total amount spent on all Bitcoin purchases and
            dividing by the total number of Bitcoin acquired. This method simplifies calculations but may not optimize
            for tax purposes.
          </p>
        )}
      </div>

      <div className="rounded-lg border border-border p-4">
        <h3 className="mb-4 text-lg font-medium text-white">Potential Tax Implications</h3>
        <p className="mb-2 text-muted-foreground">
          Estimated tax liability on unrealized gains:{" "}
          <span className="font-medium text-white">{data.potentialTaxLiability}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Note: This is an estimate based on a 15% long-term capital gains tax rate. Your actual tax situation may vary.
          Consult with a tax professional for personalized advice.
        </p>
      </div>
    </div>
  )
}

