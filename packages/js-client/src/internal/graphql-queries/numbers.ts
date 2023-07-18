import { gql } from 'graphql-request';

export const QueryNumbers = gql`
  query Numbers(
    $limit: Int!
    $skip: Int!
    $direction: OrderDirection!
    $sortBy: Numbers_orderBy!
  ) {
    daos(
      first: $limit
      skip: $skip
      orderDirection: $direction
      orderBy: $sortBy
    ) {
      id
      subdomain
      number {
        value
      }
    }
  }
`;

export const QueryNumber = gql`
  query Number($proposalId: ID!) {
    dao(id: $proposalId) {
      number {
        value
      }
    }
  }
`;
