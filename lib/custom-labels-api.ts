import { GraphApi, GraphRequestOptions } from './graph-api';

/**
 * CustomLabels class provides methods to interact with custom labels API.
 */
export class CustomLabelsAPI {
  constructor(private readonly graphRequest: GraphApi) {}

  /**
   * Creates a new custom label.
   *
   * @param name The name of the custom label.
   * @returns The API response.
   */
  async createCustomLabel(name: string): Promise<any> {
    if (!name) {
      throw new Error('name required');
    }
    const options: GraphRequestOptions = {
      payload: { name },
    };
    const response = await this.callCustomLabelsApi(options);
    return response;
  }

  /**
   * Retrieves the id and name of a custom label.
   *
   * @param label_id The ID of a custom label.
   * @returns The API response.
   */
  async getCustomLabelById(label_id: string): Promise<any> {
    if (!label_id) {
      throw new Error('label_id required');
    }
    const options: GraphRequestOptions = {
      path: '/' + label_id,
      qs: { fields: 'id,name' },
    };
    const response = await this.callCustomLabelsApi(options);
    return response;
  }

  /**
   * Deletes a custom label.
   *
   * @param label_id The ID of the custom label to delete.
   * @returns The API response.
   */
  async deleteCustomLabel(label_id: string): Promise<any> {
    if (!label_id) {
      throw new Error('label_id required');
    }
    const options: GraphRequestOptions = {
      method: 'DELETE',
      path: '/' + label_id,
    };
    const response = await this.callCustomLabelsApi(options);
    return response;
  }

  /**
   * Associates a user's PSID to a custom label.
   *
   * @param psid PSID of the user to associate with the custom label.
   * @param label_id The ID of a custom label.
   * @returns The API response.
   */
  async addPsidtoCustomLabel(psid: string, label_id: string): Promise<any> {
    if (!psid || !label_id) {
      throw new Error('PSID and label_id required');
    }
    const options: GraphRequestOptions = {
      path: `/${label_id}/label`,
      payload: { user: psid },
    };
    const response = await this.callCustomLabelsApi(options);
    return response;
  }

  /**
   * Removes a user PSID from a custom label.
   *
   * @param psid PSID of the user to remove from the custom label.
   * @param label_id The ID of a custom label.
   * @returns The API response.
   */
  async removePsidfromCustomLabel(
    psid: string,
    label_id: string,
  ): Promise<any> {
    if (!psid || !label_id) {
      throw new Error('PSID and label_id required');
    }
    const options: GraphRequestOptions = {
      method: 'DELETE',
      path: `/${label_id}/label`,
      payload: { user: psid },
    };
    const response = await this.callCustomLabelsApi(options);
    return response;
  }

  /**
   * Perform the Graph API call
   *
   * @param options request options
   * @returns API response
   */
  private async callCustomLabelsApi(
    options: GraphRequestOptions,
  ): Promise<any> {
    options.apiVersion = 'v2.11';

    if (!options.path) {
      options.path = '/me/custom_labels';
    }

    return this.graphRequest.sendRequest(options);
  }
}
