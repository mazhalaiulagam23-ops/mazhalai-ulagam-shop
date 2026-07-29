import { useMemo, useState } from "react";
import { SearchX } from "lucide-react";
import { ageGroups, categories, discountPercent, type Product } from "@/data/catalog";
import { ProductCard } from "./ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inr } from "@/lib/shop-store";

const PAGE_SIZE = 8;

type SortKey = "popularity" | "price-asc" | "price-desc" | "newest" | "discount";

export function ProductListing({
  items,
  initialQuery = "",
  showCategoryFilter = true,
}: {
  items: Product[];
  initialQuery?: string;
  showCategoryFilter?: boolean;
}) {
  const maxPrice = useMemo(() => Math.max(...items.map((p) => p.price), 1000), [items]);
  const [query, setQuery] = useState(initialQuery);
  const [cats, setCats] = useState<string[]>([]);
  const [ages, setAges] = useState<string[]>([]);
  const [price, setPrice] = useState<number[]>([maxPrice]);
  const [sort, setSort] = useState<SortKey>("popularity");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((p) => {
      if (q && !`${p.name} ${p.tags.join(" ")} ${p.category}`.toLowerCase().includes(q)) return false;
      if (cats.length && !cats.includes(p.category)) return false;
      if (ages.length && !ages.includes(p.ageGroup)) return false;
      if (p.price > price[0]) return false;
      return true;
    });

    const sorted = [...list];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case "discount":
        sorted.sort((a, b) => discountPercent(b) - discountPercent(a));
        break;
      default:
        sorted.sort((a, b) => b.reviews * b.rating - a.reviews * a.rating);
    }
    return sorted;
  }, [items, query, cats, ages, price, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const toggle = (arr: string[], set: (v: string[]) => void, value: string) => {
    set(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
    setPage(1);
  };

  const reset = () => {
    setQuery("");
    setCats([]);
    setAges([]);
    setPrice([maxPrice]);
    setPage(1);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="surface-card h-fit space-y-6 p-5">
        <div>
          <Label htmlFor="filter-search" className="text-sm font-bold">
            Search
          </Label>
          <Input
            id="filter-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search products"
            className="mt-2"
          />
        </div>

        {showCategoryFilter && (
          <fieldset>
            <legend className="text-sm font-bold">Category</legend>
            <div className="mt-2 space-y-2">
              {categories.map((c) => (
                <div key={c.slug} className="flex items-center gap-2">
                  <Checkbox
                    id={`cat-${c.slug}`}
                    checked={cats.includes(c.slug)}
                    onCheckedChange={() => toggle(cats, setCats, c.slug)}
                  />
                  <Label htmlFor={`cat-${c.slug}`} className="text-sm font-normal">
                    {c.name}
                  </Label>
                </div>
              ))}
            </div>
          </fieldset>
        )}

        <fieldset>
          <legend className="text-sm font-bold">Age group</legend>
          <div className="mt-2 space-y-2">
            {ageGroups.map((a) => (
              <div key={a} className="flex items-center gap-2">
                <Checkbox id={`age-${a}`} checked={ages.includes(a)} onCheckedChange={() => toggle(ages, setAges, a)} />
                <Label htmlFor={`age-${a}`} className="text-sm font-normal">
                  {a}
                </Label>
              </div>
            ))}
          </div>
        </fieldset>

        <div>
          <p className="text-sm font-bold">Max price: {inr(price[0])}</p>
          <Slider
            className="mt-3"
            value={price}
            onValueChange={(v) => {
              setPrice(v);
              setPage(1);
            }}
            min={100}
            max={maxPrice}
            step={50}
            aria-label="Maximum price"
          />
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={reset}>
          Clear filters
        </Button>
      </aside>

      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing <strong className="text-foreground">{visible.length}</strong> of {filtered.length} products
          </p>
          <div className="flex items-center gap-2">
            <Label htmlFor="sort" className="text-sm">
              Sort by
            </Label>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger id="sort" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="price-asc">Price: low to high</SelectItem>
                <SelectItem value="price-desc">Price: high to low</SelectItem>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="discount">Biggest discount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="surface-card flex flex-col items-center gap-3 p-12 text-center">
            <SearchX className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-lg font-bold">No products found</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Try a different search term, widen the price range or clear the filters.
            </p>
            <Button onClick={reset}>Clear filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>
              Previous
            </Button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Button
                key={n}
                size="sm"
                variant={n === current ? "default" : "outline"}
                aria-current={n === current ? "page" : undefined}
                onClick={() => setPage(n)}
              >
                {n}
              </Button>
            ))}
            <Button variant="outline" size="sm" disabled={current === pages} onClick={() => setPage(current + 1)}>
              Next
            </Button>
          </nav>
        )}
      </div>
    </div>
  );
}
