import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Template } from "@/components/steps/TemplateSelector";
import { DocumentType } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";

// Query hook to get all templates
export function useTemplates(documentType?: DocumentType) {
  return useQuery({
    queryKey: documentType ? ['/api/templates', documentType] : ['/api/templates'],
    queryFn: async () => {
      const url = documentType 
        ? `/api/templates?documentType=${documentType}` 
        : '/api/templates';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      return response.json();
    },
  });
}

// Query hook to get a single template by ID
export function useTemplate(id: number) {
  return useQuery({
    queryKey: ['/api/templates', id],
    queryFn: async () => {
      const response = await fetch(`/api/templates/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch template");
      }
      return response.json();
    },
    enabled: !!id,
  });
}

// Mutation hook to create a new template
export function useCreateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: Omit<Template, "id">) => {
      return apiRequest('POST', '/api/templates', template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    }
  });
}

// Mutation hook to update a template
export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, template }: { id: number; template: Omit<Template, "id"> }) => {
      return apiRequest('PUT', `/api/templates/${id}`, template);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates', variables.id] });
    }
  });
}

// Mutation hook to delete a template
export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
    }
  });
}