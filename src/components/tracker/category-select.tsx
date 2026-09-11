"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MainNode } from "@/lib/selectors";

export function CategorySelect({ tree, value, onChange, id }: { tree: MainNode[]; value: string; onChange: (id: string) => void; id?: string }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger id={id} aria-label="Category">
        <SelectValue placeholder="Choose a sub category" />
      </SelectTrigger>
      <SelectContent>
        {tree.map((main) => (
          <SelectGroup key={main.category.id}>
            <SelectLabel>{main.category.name}</SelectLabel>
            {main.subs.map((sub) => (
              <SelectItem key={sub.category.id} value={sub.category.id}>
                {sub.category.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
