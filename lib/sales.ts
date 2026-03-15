import { getAuthHeaders } from './auth'
import { API_BASE_URL } from './api' // Import the base URL to avoid re-defining it

// Import the existing data types since they are the same structure
// This is a key principle of DRY (Don't Repeat Yourself)
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  Order,
  CreateOrderRequest,
  UpdateOrderRequest,
} from './api'

// API Endpoints specifically for the Sales module
export const SALES_API_ENDPOINTS = {
  // Sales Customer endpoints
  CUSTOMERS: '/sales/customers',
  CUSTOMER_BY_ID: (id: string | number) => `/sales/customers/${id}`,
  
  // Sales Order endpoints
  ORDERS: '/sales/orders',
  ORDER_BY_ID: (id: string | number) => `/sales/orders/${id}`,
}

/**
 * ApiClient for handling all API requests related to the Sales module.
 * This class mirrors the structure of the main ApiClient but is focused
 * on sales-specific endpoints like '/sales/customers' and '/sales/orders'.
 */
export class SalesApiClient {
  /**
   * A private helper method to make authenticated API requests.
   * It constructs the full URL, adds authorization headers, and handles the response.
   */
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const headers = getAuthHeaders()
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json', // Good practice to always set this for POST/PUT
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      // Attempt to get more detailed error info from the response body
      const errorBody = await response.text();
      console.error("API Error Response:", errorBody);
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }
    
    // Handle successful responses that might not have a body (e.g., 204 No Content for DELETE)
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json()
  }

  // Sales Customer Management API calls
  
  /**
   * Fetches a list of all customers from the sales endpoint.
   */
  static async getSalesCustomers(): Promise<Customer[]> {
    return this.makeRequest<Customer[]>(SALES_API_ENDPOINTS.CUSTOMERS, {
      method: 'GET',
    })
  }

  /**
   * Fetches a single customer by their ID from the sales endpoint.
   */
  static async getSalesCustomerById(id: string | number): Promise<Customer> {
    return this.makeRequest<Customer>(SALES_API_ENDPOINTS.CUSTOMER_BY_ID(id), {
      method: 'GET',
    })
  }

  /**
   * Creates a new customer via the sales endpoint.
   */
  static async createSalesCustomer(customerData: CreateCustomerRequest): Promise<Customer> {
    return this.makeRequest<Customer>(SALES_API_ENDPOINTS.CUSTOMERS, {
      method: 'POST',
      body: JSON.stringify(customerData),
    })
  }

  /**
   * Updates an existing customer by their ID via the sales endpoint.
   */
  static async updateSalesCustomer(id: string | number, customerData: UpdateCustomerRequest): Promise<Customer> {
    return this.makeRequest<Customer>(SALES_API_ENDPOINTS.CUSTOMER_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(customerData),
    })
  }

  /**
   * Deletes a customer by their ID via the sales endpoint.
   */
  static async deleteSalesCustomer(id: string | number): Promise<void> {
    await this.makeRequest<void>(SALES_API_ENDPOINTS.CUSTOMER_BY_ID(id), {
      method: 'DELETE',
    })
  }

  // Sales Order Management API calls
  
  /**
   * Fetches a list of all orders from the sales endpoint.
   */
  static async getSalesOrders(): Promise<Order[]> {
    return this.makeRequest<Order[]>(SALES_API_ENDPOINTS.ORDERS, {
      method: 'GET',
    })
  }

  /**
   * Fetches a single order by its ID from the sales endpoint.
   */
  static async getSalesOrderById(id: string | number): Promise<Order> {
    return this.makeRequest<Order>(SALES_API_ENDPOINTS.ORDER_BY_ID(id), {
      method: 'GET',
    })
  }

  /**
   * Creates a new order via the sales endpoint.
   */
  static async createSalesOrder(orderData: CreateOrderRequest): Promise<Order> {
    return this.makeRequest<Order>(SALES_API_ENDPOINTS.ORDERS, {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
  }

  /**
   * Updates an existing order by its ID via the sales endpoint.
   */
  static async updateSalesOrder(id: string | number, orderData: UpdateOrderRequest): Promise<Order> {
    return this.makeRequest<Order>(SALES_API_ENDPOINTS.ORDER_BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(orderData),
    })
  }

  /**
   * Deletes an order by its ID via the sales endpoint.
   */
  static async deleteSalesOrder(id: string | number): Promise<void> {
    await this.makeRequest<void>(SALES_API_ENDPOINTS.ORDER_BY_ID(id), {
      method: 'DELETE',
    })
  }
}


/**
 * Represents the structure of a Real Customer object received from the API.
 * The fields are based on the SQL query in your FastAPI backend.
 */
 export interface RealCustomer {
  id: number;
  customer_name: string;
  mobile_number: string;
  whatsapp_number?: string; // Optional field
  address?: string;          // Optional field
  requirements?: string;     // Optional field
  status: string; // e.g., 'active', 'inactive', 'converted'
  created_by: number;
  created_on: string; // ISO 8601 date string (e.g., "2023-10-27T10:00:00")
  updated_on?: string; // Optional ISO 8601 date string
  
  // This field comes from the JOIN in the backend query
  created_by_staff_name: string; 
}

/**
 * Defines the shape of the data required for updating a Real Customer.
 * It allows for partial updates, so all fields are optional.
 */
export type RealCustomerUpdateData = Partial<Pick<
  RealCustomer, 
  'customer_name' | 'mobile_number' | 'whatsapp_number' | 'address' | 'requirements' | 'status'
>>;


// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetches a list of all real customers from the API.
 * Corresponds to: GET /real_customers
 * 
 * @returns A promise that resolves to an array of RealCustomer objects.
 * @throws Will throw an error if the API request fails.
 */
export const getRealCustomers = async (): Promise<RealCustomer[]> => {
  try {
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/sales/real_customers`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      // Throw an error with status to be handled by the caller
      throw new Error(`Failed to fetch real customers: ${response.status} ${response.statusText}`);
    }

    const data: RealCustomer[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getRealCustomers:", error);
    // Re-throw the error so the calling component can handle it (e.g., show an error message)
    throw error;
  }
};

/**
 * Fetches a single real customer by their ID.
 * Corresponds to: GET /real_customers/{real_customer_id}
 * 
 * @param realCustomerId The unique identifier of the customer to fetch.
 * @returns A promise that resolves to a single RealCustomer object.
 * @throws Will throw an error if the customer is not found (404) or if the request fails.
 */
export const getRealCustomerById = async (realCustomerId: number): Promise<RealCustomer> => {
  try {
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/sales/real_customers/${realCustomerId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Real customer not found.');
        }
      throw new Error(`Failed to fetch real customer: ${response.status} ${response.statusText}`);
    }

    const data: RealCustomer = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in getRealCustomerById for ID ${realCustomerId}:`, error);
    throw error;
  }
};

/**
 * Updates a real customer's details.
 * Corresponds to: PUT /real_customers/{real_customer_id}
 * 
 * @param realCustomerId The ID of the customer to update.
 * @param updateData An object containing the fields to update.
 * @returns A promise that resolves to the updated RealCustomer object.
 * @throws Will throw an error if the customer is not found (404), data is invalid (400), or the request fails.
 */
export const updateRealCustomer = async (
  realCustomerId: number, 
  updateData: RealCustomerUpdateData
): Promise<RealCustomer> => {
  try {
    const headers = {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    };
    
    const response = await fetch(`${API_BASE_URL}/sales/real_customers/${realCustomerId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Real customer not found.');
        }
        if (response.status === 400) {
            const errorData = await response.json();
            throw new Error(`Failed to update: ${errorData.detail || 'Invalid data provided.'}`);
        }
      throw new Error(`Failed to update real customer: ${response.status} ${response.statusText}`);
    }

    const data: RealCustomer = await response.json();
    return data;
  } catch (error) {
    console.error(`Error in updateRealCustomer for ID ${realCustomerId}:`, error);
    throw error;
  }
};




export interface StaffUser {
  id: number;
  staff_name: string;
  role: string; // e.g., 'sales', 'crm'
}

export const getStaffByRoles = async (): Promise<StaffUser[]> => {
  try {
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/sales/staff_by_roles`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch staff by roles: ${response.status} ${response.statusText}`);
    }

    const data: StaffUser[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getStaffByRoles:", error);
    throw error;
  }
};

export interface SalesTask {
  id: number
  order_id: number
  task_description: string
  status: string
  assigned_on: string
  completion_time: string
  order_completion_date: string
  completed_on: string | null

  customer: {
    id: number
    name: string
  }

  order: {
    id: number
    generated_order_id: string
    product_name: string
  }

  assigned_by: {
    id: number
    staff_name: string
    role: string
  }

  assigned_to: {
    id: number
    staff_name: string
    role: string
  }

  updated_by: {
    id: number | null
    staff_name: string | null
    role: string | null
  }
}

export const getSalesTasks = async (): Promise<SalesTask[]> => {
  const headers = getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/sales/tasks`, {
    method: "GET",
    headers
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch tasks: ${response.status}`)
  }

  return response.json()
}