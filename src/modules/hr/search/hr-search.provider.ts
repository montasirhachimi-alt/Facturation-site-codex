import type { SearchProvider, SearchQuery, SearchResult } from "@/runtime/search";
import { hrLocalService } from "@/modules/hr";
import { mapHrEmployeeToSearchResult } from "./hr-search.mapper";

export const hrSearchProviders: readonly SearchProvider[] = Object.freeze([
  Object.freeze({
    moduleId: "hr.employees",
    label: "HR Employees Search Provider",
    search: async (query: SearchQuery) => {
      const snapshot = hrLocalService.getSnapshot();
      const departments = new Map(snapshot.departments.map((department) => [department.id, department]));
      const positions = new Map(snapshot.positions.map((position) => [position.id, position]));

      return Object.freeze(
        snapshot.employees
          .filter((employee) => !employee.archivedAt && employee.status !== "archived")
          .map((employee) => mapHrEmployeeToSearchResult(employee, query.text, departments, positions))
          .filter(isSearchResult)
      );
    }
  })
]);

export const hrSearchProvider = hrSearchProviders[0];

function isSearchResult(result: SearchResult | undefined): result is SearchResult {
  return Boolean(result);
}
