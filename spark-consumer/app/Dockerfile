FROM bitnami/spark:3.5.5

#TODO check if we can remove this 


#RUN install_packages curl
#RUN install_packages unzip
#RUN install_packages zip
#RUN curl -s "https://get.sdkman.io" | bash
#RUN echo cat  ~/.zshrc
#RUN bash -c "source $HOME/.sdkman/bin/sdkman-init.sh && sdk install java 11.0.17-zulu"



# Copy your Spark script into the image
RUN pip install graphframes
RUN pip install keybert
#RUN pip install pandas

#RUN pip install vaderSentiment

#RUN pip install spark-nlp==6.0.2
