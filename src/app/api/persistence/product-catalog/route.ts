import { NextResponse } from "next/server";
import {
  applyProductCatalogImport,
  loadProductCatalogSnapshot,
  persistProductCatalogRecord,
  ProductCatalogPersistenceError,
  type ProductCatalogPersistenceResource
} from "@/server/persistence/product-catalog-repository";
import { requirePersistenceTenantScope } from "@/server/persistence/tenant-scope";
import type { ProductImportRequest } from "@/modules/products";

const resources = new Set<ProductCatalogPersistenceResource>(["product", "category"]);

export async function GET() {
  try {
    const scope = await requirePersistenceTenantScope();
    const snapshot = await loadProductCatalogSnapshot(scope);
    return NextResponse.json(snapshot);
  } catch (error) {
    const response = toProductCatalogErrorResponse(error, "GET");
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function POST(request: Request) {
  try {
    const scope = await requirePersistenceTenantScope();
    const body = await request.json() as { operation?: "importProducts"; payload?: ProductImportRequest; resource?: ProductCatalogPersistenceResource; record?: unknown };
    if (body.operation === "importProducts" && body.payload) {
      const result = await applyProductCatalogImport(scope, body.payload);
      const snapshot = await loadProductCatalogSnapshot(scope);
      return NextResponse.json({ result, snapshot });
    }

    if (!body.resource || !resources.has(body.resource) || !body.record) {
      return NextResponse.json({ error: "Payload catalogue invalide." }, { status: 400 });
    }

    const record = await persistProductCatalogRecord(scope, body.resource, body.record);
    return NextResponse.json({ record });
  } catch (error) {
    const response = toProductCatalogErrorResponse(error, "POST");
    return NextResponse.json(response.body, { status: response.status });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erreur catalogue inconnue.";
}

function toProductCatalogErrorResponse(error: unknown, operation: "GET" | "POST") {
  if (error instanceof ProductCatalogPersistenceError) {
    return {
      status: error.status,
      body: { error: error.message, code: error.code }
    };
  }

  const message = getErrorMessage(error);
  if (message.includes("Session requise")) {
    return {
      status: 401,
      body: { error: "Session expirée. Reconnectez-vous puis réessayez.", code: "unauthorized" }
    };
  }

  if (message.includes("Aucune entreprise active")) {
    return {
      status: 403,
      body: { error: "Aucune entreprise active n'est associée à cette session.", code: "missing_tenant" }
    };
  }

  console.error("[product-catalog:persistence-error]", {
    operation,
    route: "/api/persistence/product-catalog",
    errorName: error instanceof Error ? error.name : typeof error,
    errorMessage: message,
    prismaCode: getPrismaErrorCode(error),
    stack: error instanceof Error ? error.stack : undefined
  });

  return {
    status: 500,
    body: { error: "Le catalogue produit n'a pas pu être synchronisé avec la base. Réessayez ou contactez l'administrateur.", code: "persistence_error" }
  };
}

function getPrismaErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : undefined;
}
