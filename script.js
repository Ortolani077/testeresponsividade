$(document).ready(function () {
    const deliveryFee = 5.00;
    let cart = [];
    let selectedFlavors = [];
    const maxFlavors = 2;
    const pizzaCategoriaId = 2; // Categoria para pizzas
    const esfihaCategoriaId = 5; // Categoria para esfihas

    // Configuração do carrossel
    $('.carousel').slick({
        infinite: true,
        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 2000,
        dots: true,
    });

    // Função para carregar pizzas do banco de dados filtradas por categoria
    function loadPizzasFromDB() {
        $.ajax({
            url: `/delivery/produtos/categoria/${pizzaCategoriaId}`, // URL ajustada para incluir a categoria de pizzas
            method: 'GET',
            dataType: 'json',
            success: function (pizzas) {
                $('#pizzas-list').empty(); // Limpar lista de pizzas antes de adicionar novas
                pizzas.forEach(pizza => {
                    $('#pizzas-list').append(`
                        <div class="pizza-item col-md-4" data-id="${pizza.id}" data-name="${pizza.nome}" data-price="${pizza.preco}">
                            <h5>${pizza.nome}</h5>
                            <p>R$ ${pizza.preco.toFixed(2)}</p>
                            <p>${pizza.descricao}</p>
                            <button class="btn btn-primary select-flavor">Selecionar Sabor</button>
                        </div>
                    `);
                });
            },
            error: function (xhr, status, error) {
                console.error('Erro ao carregar as pizzas:', error);
            }
        });
    }

    // Função para carregar esfihas do banco de dados filtradas por categoria
    function loadEsfihasFromDB() {
        $.ajax({
            url: `/delivery/produtos/categoria/${esfihaCategoriaId}`, // URL ajustada para incluir a categoria de esfihas
            method: 'GET',
            dataType: 'json',
            success: function (esfihas) {
                $('#esfihas-list').empty(); // Limpar lista de esfihas antes de adicionar novas
                esfihas.forEach(esfiha => {
                    $('#esfihas-list').append(`
                        <div class="esfiha-item col-md-4" data-id="${esfiha.id}" data-name="${esfiha.nome}" data-price="${esfiha.preco}">
                            <h5>${esfiha.nome}</h5>
                            <p>R$ ${esfiha.preco.toFixed(2)}</p>
                            <p>${esfiha.descricao}</p>
                            <button class="btn btn-primary add-to-cart">Adicionar ao Carrinho</button>
                        </div>
                    `);
                });
            },
            error: function (xhr, status, error) {
                console.error('Erro ao carregar as esfihas:', error);
            }
        });
    }

    // Carregar pizzas ao carregar a página
    loadPizzasFromDB();

    // Manipulador de clique para o botão de esfihas
    $('#esfihasButton').on('click', function () {
        // Verificar se a lista de esfihas já foi carregada
        if ($('#esfihas-list').children().length === 0) {
            loadEsfihasFromDB();
        }
    });

    // Selecionar sabor para pizza meio a meio
    $(document).on('click', '.select-flavor', function () {
        const id = $(this).closest('.pizza-item').data('id');
        const name = $(this).closest('.pizza-item').data('name');
        const price = $(this).closest('.pizza-item').data('price');

        if (selectedFlavors.length < maxFlavors) {
            selectedFlavors.push({ id, name, price });
            $(this).text('Sabor Selecionado');
        }

        if (selectedFlavors.length === maxFlavors) {
            addPizzaToCart();
            resetFlavorSelection();
        }
    });

    // Adicionar a pizza ao carrinho com sabores selecionados
    function addPizzaToCart() {
        const pizzaName = selectedFlavors.map(flavor => flavor.name).join(' / ');
        const highestPrice = Math.max(...selectedFlavors.map(flavor => flavor.price));

        cart.push({
            id: `meio-a-meio-${Date.now()}`,
            name: pizzaName,
            price: highestPrice,
            quantity: 1
        });

        updateCart();
    }

    // Resetar a seleção de sabores
    function resetFlavorSelection() {
        selectedFlavors = [];
        $('.select-flavor').text('Selecionar Sabor');
    }

    // Adicionar ao carrinho
    $(document).on('click', '.add-to-cart', function () {
        const id = $(this).closest('.esfiha-item').data('id');
        const name = $(this).closest('.esfiha-item').data('name');
        const price = $(this).closest('.esfiha-item').data('price');

        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price, quantity: 1 });
        }

        updateCart();
    });

    // Atualizar carrinho
    function updateCart() {
        $('#cart-items').empty();
        let total = 0;

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            $('#cart-items').append(`
                <div class="cart-item">
                    <p>${item.name} x${item.quantity} - R$ ${itemTotal.toFixed(2)}</p>
                    <button class="btn btn-sm btn-danger remove-from-cart" data-id="${item.id}">Remover</button>
                </div>
            `);
        });

        $('#cart-total').text(total.toFixed(2));
        updateFinalTotal();
    }

    // Atualizar o total final
    function updateFinalTotal() {
        let finalTotal = parseFloat($('#cart-total').text());
        if ($('#deliveryOption').val() === 'entrega') {
            finalTotal += deliveryFee;
            $('#delivery-fee').show();
        } else {
            $('#delivery-fee').hide();
        }
        $('#final-total').text(finalTotal.toFixed(2));
    }

    // Remover do carrinho
    $(document).on('click', '.remove-from-cart', function () {
        const id = $(this).data('id');
        cart = cart.filter(item => item.id !== id);
        updateCart();
    });

    // Limpar carrinho
    $('#clear-cart-btn').on('click', function () {
        cart = [];
        updateCart();
    });

    // Finalizar compra
    $('#checkout-form').on('submit', function (e) {
        e.preventDefault();

        const clientName = $('#clientName').val();
        const clientPhone = $('#clientPhone').val();
        const clientEmail = $('#clientEmail').val();
        const clientAddress = $('#clientAddress').val();
        const houseNumber = $('#houseNumber').val();
        const complement = $('#complement').val();
        const reference = $('#reference').val();
        const deliveryOption = $('#deliveryOption').val();
        const paymentMethod = $('#paymentMethod').val();
        const observacoes = $('#observacoes').val() || ''; // Garantir que observações não sejam undefined
        const finalTotal = parseFloat($('#final-total').text());

        let troco = null;
        if (paymentMethod === 'dinheiro') {
            const changeGiven = parseFloat($('#changeGiven').val());
            if (!isNaN(changeGiven) && changeGiven >= finalTotal) {
                troco = changeGiven - finalTotal;
                $('#change').text(troco.toFixed(2));
                $('#change-output').show();
            } else {
                $('#change-output').hide();
                alert('O valor recebido não é suficiente ou inválido.');
                return;
            }
        } else {
            $('#change-output').hide();
        }

        const paymentMethodText = {
            cartao: 'Cartão de Crédito/Débito',
            dinheiro: 'Dinheiro',
            pix: 'PIX na Entrega'
        }[paymentMethod] || 'Método de pagamento não especificado';

        const pedidoDTO = {
            emailCliente: clientEmail,
            nomeCliente: clientName,
            telefoneCliente: clientPhone,
            enderecoCliente: `${clientAddress}, ${houseNumber}, ${complement}, ${reference}`,
            entrega: deliveryOption === 'entrega',
            preco: finalTotal,
            observacoes: `${observacoes} Pagamento: ${paymentMethodText}${paymentMethod === 'dinheiro' ? `; Troco a ser devolvido R$ ${troco ? troco.toFixed(2) : ''}` : ''}`,
            itens: cart.map(item => ({
                produtoId: item.id,
                quantidade: item.quantity
            }))
        };

        console.log('Enviando pedido:', pedidoDTO);

        // Enviar pedido para o servidor
        $.ajax({
            url: '/pedidos/criar',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(pedidoDTO),
            success: function () {
                alert('Pedido realizado com sucesso!');
                $('#checkout-form')[0].reset();
                $('#cart-items').empty();
                $('#cart-total').text('0.00');
                $('#final-total').text('0.00');
            },
            error: function (xhr, status, error) {
                console.error('Erro ao criar pedido:', error);
            }
        });
    });

    // Atualizar o total final ao alterar opção de entrega
    $('#deliveryOption').on('change', function () {
        updateFinalTotal();
    });
});
