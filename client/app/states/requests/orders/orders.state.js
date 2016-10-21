(function() {
  'use strict';

  angular.module('app.states')
    .run(appRun);

  /** @ngInject */
  function appRun(routerHelper) {
    routerHelper.configureStates(getStates());
  }

  function getStates() {
    return {
      'requests.orders': {
        parent: 'application',
        url: '/requests/orders',
        templateUrl: 'app/states/requests/orders/orders.html',
        controller: OrdersController,
        controllerAs: 'vm',
        title: N_('Orders'),
        resolve: {
          orders: resolveOrders,
        },
      },
    };
  }

  /** @ngInject */
  function resolveOrders(CollectionsApi) {
    return CollectionsApi.query('service_orders', {
      expand: ['resources', 'service_requests'],
      filter: ['state=ordered'],
    });
  }

  /** @ngInject */
  function OrdersController($state, orders, RequestsState, OrdersState, $filter, ListView, Language) {
    var vm = this;

    vm.title = __('Order History');
    vm.orders = orders.resources;
    vm.ordersList = angular.copy(vm.orders);

    vm.orderListConfig = {
      showSelectBox: false,
      selectionMatchProp: 'id',
      onClick: handleOrderClick,
    };

    vm.orderToolbarConfig = {
      filterConfig: {
        fields: [
          {
            id: 'name',
            title: __('Name'),
            placeholder: __('Filter by Name'),
            filterType: 'text',
          },
          {
            id: 'id',
            title: __('Order ID'),
            placeholder: __('Filter by ID'),
            filterType: 'text',
          },
          {
            id: 'placed_at',
            title: __('Order Date'),
            placeholder: __('Filter by Order Date'),
            filterType: 'text',
          },
        ],
        resultsCount: vm.ordersList.length,
        appliedFilters: OrdersState.filterApplied ? OrdersState.getFilters() : [],
        onFilterChange: orderFilterChange,
      },
      sortConfig: {
        fields: [
          {
            id: 'name',
            title: __('Name'),
            sortType: 'alpha',
          },
          {
            id: 'id',
            title: __('Order ID'),
            sortType: 'numeric',
          },
          {
            id: 'placed_at',
            title: __('Order Date'),
            sortType: 'numeric',
          },
        ],
        onSortChange: orderSortChange,
        isAscending: OrdersState.getSort().isAscending,
        currentField: OrdersState.getSort().currentField,
      },
    };

    if (OrdersState.filterApplied) {
      orderFilterChange(OrdersState.getFilters());
      OrdersState.filterApplied = false;
    } else {
      orderApplyFilters();
    }

    function handleOrderClick(item, _e) {
      $state.go('requests.orders.details', { serviceOrderId: item.id });
    }

    function orderSortChange(sortId, direction) {
      vm.ordersList.sort(orderCompareFn);

      /* Keep track of the current sorting state */
      OrdersState.setSort(sortId, vm.orderToolbarConfig.sortConfig.isAscending);
    }

    function orderCompareFn(item1, item2) {
      var compValue = 0;
      if (vm.orderToolbarConfig.sortConfig.currentField.id === 'name') {
        compValue = item1.name.localeCompare(item2.name);
      } else if (vm.orderToolbarConfig.sortConfig.currentField.id === 'id') {
        compValue = item1.id - item2.id;
      } else if (vm.orderToolbarConfig.sortConfig.currentField.id === 'placed_at') {
        compValue = new Date(item1.placed_at || item1.updated_at) - new Date(item2.placed_at || item2.updated_at);
      }

      if (!vm.orderToolbarConfig.sortConfig.isAscending) {
        compValue = compValue * -1;
      }

      return compValue;
    }

    function orderFilterChange(filters) {
      orderApplyFilters(filters);
      vm.orderToolbarConfig.filterConfig.resultsCount = vm.ordersList.length;
    }

    function orderApplyFilters(filters) {
      vm.ordersList = ListView.applyFilters(filters, vm.ordersList, vm.orders, OrdersState, orderMatchesFilter);

      /* Make sure sorting direction is maintained */
      orderSortChange(OrdersState.getSort().currentField, OrdersState.getSort().isAscending);
    }

    function orderMatchesFilter(item, filter) {
      if (filter.id === 'name') {
        return item.name.toLowerCase().indexOf(filter.value.toLowerCase()) !== -1;
      } else if (filter.id === 'id') {
        return String(item.id).toLowerCase().indexOf(filter.value.toLowerCase()) !== -1;
      } else if (filter.id === 'placed_at') {
        return $filter('date')(item.placed_at || item.updated_at).toLowerCase().indexOf(filter.value.toLowerCase()) !== -1;
      }

      return false;
    }

    Language.fixState(OrdersState, vm.orderToolbarConfig);
  }
})();
