<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Throwable;

class ClientController extends Controller
{
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Client::class);

        $clients = Client::query()
            ->orderBy('razon_social')
            ->paginate(15);

        return response()->json($clients);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Client::class);

        $tenantId = auth()->user()->tenant_id;
        $data = $request->validate([
            'razon_social' => ['required', 'string', 'max:200'],
            'ruc' => [
                'nullable', 'string', 'max:20',
                Rule::unique('clients', 'ruc')->where('tenant_id', $tenantId),
            ],
            'direccion' => ['nullable', 'string', 'max:300'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'email' => [
                'required', 'email', 'max:150',
                Rule::unique('clients', 'email')->where('tenant_id', $tenantId),
            ],
            'estado' => ['required', Rule::in(['activo', 'inactivo', 'suspendido'])],
        ]);
        $data['id_usuario_creador'] = auth()->id();

        try {
            $client = Client::create($data);

            return response()->json($client, 201);
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'No se pudo registrar el cliente. El RUC o correo podrían estar repetidos.',
                'error' => $e->getMessage(),
            ], 422);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'No se pudo registrar el cliente.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(Client $client): JsonResponse
    {
        $this->authorize('view', $client);

        return response()->json($client);
    }

    public function update(Request $request, Client $client): JsonResponse
    {
        $this->authorize('update', $client);

        $tenantId = auth()->user()->tenant_id;
        $data = $request->validate([
            'razon_social' => ['required', 'string', 'max:200'],
            'ruc' => [
                'nullable', 'string', 'max:20',
                Rule::unique('clients', 'ruc')->where('tenant_id', $tenantId)->ignore($client->id),
            ],
            'direccion' => ['nullable', 'string', 'max:300'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'email' => [
                'required', 'email', 'max:150',
                Rule::unique('clients', 'email')->where('tenant_id', $tenantId)->ignore($client->id),
            ],
            'estado' => ['required', Rule::in(['activo', 'inactivo', 'suspendido'])],
        ]);

        try {
            $client->update($data);

            return response()->json($client);
        } catch (QueryException $e) {
            return response()->json([
                'message' => 'No se pudo actualizar el cliente. El RUC o correo podrían estar repetidos.',
                'error' => $e->getMessage(),
            ], 422);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'No se pudo actualizar el cliente.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Client $client): JsonResponse
    {
        $this->authorize('delete', $client);

        try {
            $client->delete();

            return response()->json(null, 204);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'No se pudo eliminar el cliente.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
