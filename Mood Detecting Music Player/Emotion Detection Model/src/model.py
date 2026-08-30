import torch
import torch.nn as nn


class EmotionModel(nn.Module):

    def __init__(
        self,
        vocab_size,
        embedding_dim=128,
        hidden_dim=128,
        num_classes=6,
        num_layers=1,
        dropout=0.2
    ):

        super().__init__()

       
        # 1. Embedding Layer
       

        self.embedding = nn.Embedding(
            num_embeddings=vocab_size,
            embedding_dim=embedding_dim,
            padding_idx=0
        )


        
        # 2. LSTM Layer
       

        self.lstm = nn.LSTM(
            input_size=embedding_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )


        
        # 3. Dropout
      

        self.dropout = nn.Dropout(dropout)


        # 4. Output Layer
     

        self.fc = nn.Linear(
            hidden_dim,
            num_classes
        )


    
    # Forward Pass
   

    def forward(self, input_ids):

        # Convert token IDs into embeddings
        embedded = self.embedding(input_ids)


        # Pass embeddings through LSTM
        output, (hidden, cell) = self.lstm(embedded)


        # Get actual sequence lengths (number of non-padding tokens)
        lengths = (input_ids != 0).sum(dim=1).clamp(min=1)

        # Extract the hidden state from the last valid time step for each sequence
        batch_size = input_ids.size(0)
        batch_idx = torch.arange(batch_size, device=output.device)
        final_hidden = output[batch_idx, lengths - 1, :]


        # Apply dropout
        final_hidden = self.dropout(final_hidden)


        # Produce emotion scores
        logits = self.fc(final_hidden)


        return logits