import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { useMarketStore } from "../store/marketStore";

interface SymbolResult {
    id: number;
    symbol: string;
    name: string;
    type: string;
}

interface SymbolResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: SymbolResult[];
}

export function SymbolSearch() {
    const { currentSymbol, setSymbol } = useMarketStore();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SymbolResult[]>([]);
    const [loading, setLoading] = useState(false);

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim()) {
                fetchSymbols(query);
            } else {
                setResults([]);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [query]);

    // Initial load (optional, maybe not needed if we only search on type)
    // But user might want to see some default or recent?
    // User said "depending on the user types we send request...". 
    // And "By default we will show sensex" (this refers to initial state of chart, solved by store default).

    // Let's also support fetching default list if query is empty? 
    // "where we can search the letters" implies search driven.
    // I'll stick to search driven for now.

    const fetchSymbols = async (searchTerm: string) => {
        setLoading(true);
        try {
            // Using logic from prompt: http://127.0.0.1:8000/api/symbols/?q=a&page=2
            // We'll just fetch page 1 for now. Infinite scroll can be added if needed but ScrollArea + 50 results is usually okay for MVP first step.
            const response = await fetch(`http://127.0.0.1:8000/api/symbols/?q=${encodeURIComponent(searchTerm)}`);
            if (!response.ok) throw new Error("Failed to search symbols");

            const data: SymbolResponse = await response.json();
            setResults(data.results);
        } catch (error) {
            console.error(error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (symbol: string) => {
        setSymbol(symbol);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-between text-left font-normal bg-dark-bg border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white">
                    <span className="truncate">{currentSymbol || "Select Symbol"}</span>
                    <Search className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-dark-card border-slate-700 text-slate-200">
                <DialogHeader>
                    <DialogTitle>Search Symbol</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search (e.g. RELIANCE, TCS)..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-8 bg-dark-bg border-slate-700 text-slate-200 focus-visible:ring-brand-primary"
                        />
                    </div>
                    <ScrollArea className="h-[300px] w-full rounded-md border border-slate-700 p-4">
                        {loading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
                            </div>
                        ) : results.length > 0 ? (
                            <div className="flex flex-col gap-1">
                                {results.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelect(item.symbol)}
                                        className="flex flex-col items-start rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                                    >
                                        <span className="font-semibold text-brand-primary">{item.symbol}</span>
                                        <span className="text-xs text-slate-500">{item.name}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-sm text-slate-500 py-4">
                                {query ? "No results found." : "Type to search symbols."}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
